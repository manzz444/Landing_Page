<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'db_portofolio';
$username = 'root';
$password = '786343';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $input = json_decode(file_get_contents("php://input"), true);
    $consistency = isset($input['consistency']) ? (int)$input['consistency'] : 0;
    
    // Pastikan nilai antara 0-100 (0 DIIZINKAN!)
    $consistency = max(0, min(100, $consistency));
    
    // Update consistency saja
    $stmt = $pdo->prepare("UPDATE user_stats SET consistency = ? WHERE id = 1");
    $stmt->execute([$consistency]);
    
    // Update progress (rata-rata dari consistency dan habit_growth)
    $stmt2 = $pdo->query("SELECT consistency, habit_growth FROM user_stats WHERE id = 1");
    $current = $stmt2->fetch(PDO::FETCH_ASSOC);
    $progress = ($current['consistency'] + $current['habit_growth']) / 2;
    $pdo->prepare("UPDATE user_stats SET progress = ? WHERE id = 1")->execute([$progress]);
    
    echo json_encode([
        'status' => 'success',
        'consistency' => $consistency,
        'progress' => $progress
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>