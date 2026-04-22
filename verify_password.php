<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$correct_password = '232144'; // GANTI DENGAN PASSWORD ANDA

$input_password = $_POST['password'] ?? '';

// Debug
error_log("Password input: " . $input_password);
error_log("Correct password: " . $correct_password);

if ($input_password === $correct_password) {
    $_SESSION['journey_auth'] = true;
    $_SESSION['auth_time'] = time();
    session_write_close(); // Pastikan session tersimpan
    echo json_encode(['success' => true, 'message' => 'Login success']);
} else {
    echo json_encode(['success' => false, 'message' => 'Password salah']);
}
?>