<?php
    header('Content-Type: application/json');
    $paths = array_slice(scandir("pages"), 2);
    echo json_encode($paths);
?>