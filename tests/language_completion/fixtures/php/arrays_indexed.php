<?php
function adjust($value) {
    return $value + 5;
}

function main() {
    $values = [2, 4, 6];
    $values[1] = adjust($values[0]);
    $total = $values[0] + $values[1] + $values[2];
    echo "php_arrays";
    echo $total;
}
?>
