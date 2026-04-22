<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'db_portofolio';
$username = 'root';
$password = '786343';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Cek apakah ada project baru yang belum dihitung
    $stmt = $pdo->query("SELECT COUNT(*) as new_projects FROM projects WHERE counted_for_stats = 0");
    $newProjects = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Jika tidak ada project baru, reset stats ke 0
    if ($newProjects['new_projects'] == 0) {
        $pdo->exec("UPDATE user_stats SET consistency = 0, habit_growth = 0, progress = 0 WHERE id = 1");
    }
    
    // Ambil stats terbaru
    $stmt = $pdo->query("SELECT consistency, habit_growth, progress FROM user_stats WHERE id = 1");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$stats) {
        $pdo->exec("INSERT INTO user_stats (id, consistency, habit_growth, progress) VALUES (1, 0, 0, 0)");
        $stats = ['consistency' => 0, 'habit_growth' => 0, 'progress' => 0];
    }
    
    echo json_encode([
        'status' => 'success',
        'consistency' => (int)$stats['consistency'],
        'habit_growth' => (int)$stats['habit_growth'],
        'progress' => (int)$stats['progress'],
        'message' => $newProjects['new_projects'] == 0 ? 'Tidak ada project baru. Consistency = 0' : 'Ada project baru yang meningkatkan stats'
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'consistency' => 0, 'habit_growth' => 0, 'progress' => 0]);
}
?>