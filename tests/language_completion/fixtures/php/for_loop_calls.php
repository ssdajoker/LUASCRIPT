<?php
function square($value) {
    return $value * $value;
}

function main() {
    $total = 0;
    for ($i = 1; $i <= 3; $i += 1) {
        $total += square($i);
    }
    echo "php_for";
    echo $total;
}
?>
