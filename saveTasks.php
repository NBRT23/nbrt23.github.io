<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tasks = $_POST['tasks'];
    file_put_contents('tasks.json', $tasks);
    echo 'Tasks saved successfully.';
} else {
    echo 'Invalid request method.';
}
?>
