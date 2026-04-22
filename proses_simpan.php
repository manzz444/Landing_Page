<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'db_portofolio';
$username = 'root';
$password = '786343';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $nama = trim($_POST['nama'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $pesan = trim($_POST['pesan'] ?? '');
    
    if (empty($nama) || empty($email) || empty($pesan)) {
        echo json_encode(['status' => 'error', 'message' => 'Semua field harus diisi']);
        exit;
    }
    
    // Mulai transaction
    $pdo->beginTransaction();
    
    // 1. Simpan saran
    $sql = "INSERT INTO saran (nama, email, pesan) VALUES (:nama, :email, :pesan)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':nama' => $nama, ':email' => $email, ':pesan' => $pesan]);
    
    // 2. Catat aktivitas (saran masuk)
    $pdo->prepare("INSERT INTO activity_log (activity_type, points) VALUES ('saran', 2)")->execute();
    
    // 3. Update stats (naikkan 2 poin setiap saran). Di bagian update stats, ganti jadi:
    $pdo->exec("UPDATE user_stats SET 
        consistency = LEAST(consistency + 2, 100),
        habit_growth = LEAST(habit_growth + 2, 100),
        progress = (consistency + habit_growth + 2 + 2) / 2
    WHERE id = 1");
// Hapus baris yang memaksa minimal tertentu
    
    // Pastikan progress tidak lebih dari 100
    $pdo->exec("UPDATE user_stats SET progress = LEAST(progress, 100) WHERE id = 1");
    
    $pdo->commit();
    
    echo json_encode(['status' => 'success', 'message' => 'Saran tersimpan +2 Stats!']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan']);
}
?>