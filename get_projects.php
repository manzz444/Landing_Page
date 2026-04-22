<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'db_portofolio';
$username = 'root';
$password = '786343';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    $stmt = $pdo->query("SELECT id, title, category, description, tech_stack, link_url, quality_score, counted_for_stats 
                         FROM projects ORDER BY created_at DESC");
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => 'success', 
        'projects' => $projects,
        'note' => 'Project lama (counted_for_stats=1) tidak mempengaruhi consistency tracker'
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'projects' => [], 'message' => $e->getMessage()]);
}
?>