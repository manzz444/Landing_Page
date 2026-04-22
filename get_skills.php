<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'db_portofolio';
$username = 'root';
$password = '786343';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $stmt = $pdo->query("SELECT id, skill_name, level, icon FROM skills ORDER BY id");
    $skills = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'success', 'skills' => $skills]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'skills' => []]);
}
?>