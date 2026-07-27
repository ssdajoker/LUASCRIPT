<?php
function main() {
    $reading = ["voltage" => 12, "current" => 3];
    $reading["current"] = 4;
    $total = $reading["voltage"] + $reading["current"];
    echo "php_assoc";
    echo $total;
}
?>
