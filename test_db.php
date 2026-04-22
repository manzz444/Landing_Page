<?php
$host = "localhost";
$user = "root";
$pass = "786343";
$db = "api_database";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "Connected successfully to database!<br>";

$result = $conn->query("SHOW TABLES");
echo "Tables in database:<br>";
while($row = $result->fetch_array()) {
    echo "- " . $row[0] . "<br>";
}

$conn->close();
?>