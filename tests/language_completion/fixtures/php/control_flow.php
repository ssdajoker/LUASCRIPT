<?php
function sum_to($limit) {
    $index = 0;
    $total = 0;
    while ($index < $limit) {
        $total += $index;
        $index += 1;
    }
    if ($total > 5) {
        return $total;
    }
    return 0;
}

function main() {
    echo "php_flow";
    echo sum_to(5);
}
?>
