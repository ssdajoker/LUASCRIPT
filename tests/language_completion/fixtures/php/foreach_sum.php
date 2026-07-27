<?php
function main() {
    $values = [3, 5, 7];
    $total = 0;
    foreach ($values as $value) {
        $total += $value;
    }
    echo "php_foreach";
    echo $total;
}
?>
