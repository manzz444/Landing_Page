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
    
    // Query langsung tanpa session check
    $stmt = $pdo->query("SELECT id, year, title, description FROM journey ORDER BY year ASC");
    $journey = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: log ke file
    error_log("Journey data found: " . count($journey) . " records");
    
    echo json_encode([
        'status' => 'success', 
        'journey' => $journey,
        'count' => count($journey)
    ]);
    
} catch (PDOException $e) {
    error_log("Journey error: " . $e->getMessage());
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage(), 
        'journey' => []
    ]);
}
?>