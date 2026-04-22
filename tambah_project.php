<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$dbname = 'db_portofolio';
$username = 'root';
$password = '786343';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Ambil data dari POST
    $title = trim($_POST['title'] ?? '');
    $category = trim($_POST['category'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $tech_stack = trim($_POST['tech_stack'] ?? '');
    $link_url = trim($_POST['link_url'] ?? '#');
    
    // Validasi
    if (empty($title)) {
        echo json_encode(['status' => 'error', 'message' => 'Nama project harus diisi!']);
        exit;
    }
    if (empty($category)) {
        echo json_encode(['status' => 'error', 'message' => 'Kategori harus dipilih!']);
        exit;
    }
    if (empty($description)) {
        echo json_encode(['status' => 'error', 'message' => 'Deskripsi harus diisi!']);
        exit;
    }
    
    // Hitung quality score
    $quality_score = calculateQualityScore($tech_stack);
    $consistency_points = getConsistencyPoints($category);
    $habit_points = $quality_score;
    
    // Simpan project
    $stmt = $pdo->prepare("INSERT INTO projects (title, category, description, tech_stack, link_url, quality_score, created_at) 
                           VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$title, $category, $description, $tech_stack, $link_url, $quality_score]);
    $project_id = $pdo->lastInsertId();
    
    // Update atau buat user_stats
    $checkStats = $pdo->query("SELECT * FROM user_stats WHERE id = 1");
    if ($checkStats->rowCount() == 0) {
        $pdo->exec("INSERT INTO user_stats (id, consistency, habit_growth, progress) VALUES (1, 0, 0, 0)");
    }
    
    // Update stats
    $pdo->exec("UPDATE user_stats SET 
        consistency = LEAST(consistency + $consistency_points, 100),
        habit_growth = LEAST(habit_growth + $habit_points, 100),
        progress = (consistency + habit_growth + $consistency_points + $habit_points) / 2
    WHERE id = 1");
    
    $pdo->exec("UPDATE user_stats SET progress = LEAST(progress, 100) WHERE id = 1");
    
    echo json_encode([
        'status' => 'success', 
        'message' => "✅ Project \"$title\" berhasil ditambahkan!",
        'stats' => [
            'consistency_added' => $consistency_points,
            'habit_added' => $habit_points,
            'quality_score' => $quality_score
        ]
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}

function calculateQualityScore($tech_stack) {
    if (empty($tech_stack)) return 0;
    
    $score = 0;
    $techs = explode(',', strtolower($tech_stack));
    
    foreach ($techs as $tech) {
        $tech = trim($tech);
        if (strpos($tech, 'react') !== false || strpos($tech, 'laravel') !== false || strpos($tech, 'vue') !== false) {
            $score += 25;
        } elseif (strpos($tech, 'javascript') !== false || strpos($tech, 'php') !== false || strpos($tech, 'mysql') !== false) {
            $score += 15;
        } elseif (strpos($tech, 'html') !== false || strpos($tech, 'css') !== false) {
            $score += 5;
        } else {
            $score += 10;
        }
    }
    
    if (count($techs) >= 3) $score += 10;
    if (count($techs) >= 5) $score += 15;
    
    return min(100, $score);
}

function getConsistencyPoints($category) {
    $points = [
        'Project mandiri' => 20,
        'Belajar mandiri' => 15,
        'Latihan' => 10,
        'Salinan tugas sekolah' => 5
    ];
    return $points[$category] ?? 10;
}
?>