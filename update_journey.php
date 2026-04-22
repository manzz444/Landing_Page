<?php
session_start();
header('Content-Type: application/json');

// Cek apakah sudah diverifikasi
if (!isset($_SESSION['journey_auth']) || $_SESSION['journey_auth'] !== true) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$host = 'localhost';
$dbname = 'db_portofolio';
$username = 'root';
$password = '786343';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add') {
        $year = (int)$_POST['year'];
        $title = $_POST['title'];
        $desc = $_POST['description'];
        $stmt = $pdo->prepare("INSERT INTO journey (year, title, description) VALUES (?, ?, ?)");
        $stmt->execute([$year, $title, $desc]);
        echo json_encode(['status' => 'success']);
    } 
    elseif ($action === 'edit') {
        $id = (int)$_POST['id'];
        $year = (int)$_POST['year'];
        $title = $_POST['title'];
        $desc = $_POST['description'];
        $stmt = $pdo->prepare("UPDATE journey SET year = ?, title = ?, description = ? WHERE id = ?");
        $stmt->execute([$year, $title, $desc, $id]);
        echo json_encode(['status' => 'success']);
    }
    elseif ($action === 'delete') {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("DELETE FROM journey WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success']);
    }
    else {
        echo json_encode(['status' => 'error', 'message' => 'Action tidak dikenal']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>