<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$user = "root";
$pass = "786343";
$db = "db_portofolio"; // GANTI dari api_database ke db_portofolio!

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

$method = $_SERVER["REQUEST_METHOD"];
$endpoint = isset($_GET["endpoint"]) ? $_GET["endpoint"] : "";

switch ($endpoint) {
    case "get_stats":
        getStats($conn);
        break;
    case "get_projects":
        getProjects($conn);
        break;
    case "get_skills":
        getSkills($conn);
        break;
    case "get_journey":
        getJourney($conn);
        break;
    case "save_data":
        if ($method == "POST") saveData($conn);
        break;
    default:
        echo json_encode(["message" => "API is running"]);
}

function getStats($conn) {
    $result = $conn->query("SELECT consistency, habit_growth, progress FROM user_stats WHERE id = 1");
    $data = $result->fetch_assoc();
    echo json_encode($data ? $data : ['consistency' => 0, 'habit_growth' => 0, 'progress' => 0]);
}

function getProjects($conn) {
    $result = $conn->query("SELECT id, title, category, description, tech_stack, link_url FROM projects");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

function getSkills($conn) {
    $result = $conn->query("SELECT id, skill_name, level, icon FROM skills");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

function getJourney($conn) {
    $result = $conn->query("SELECT id, year, title, description FROM journey ORDER BY year ASC");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

function saveData($conn) {
    $input = json_decode(file_get_contents("php://input"), true);
    echo json_encode(["success" => true, "message" => "Data saved"]);
}

$conn->close();
?>