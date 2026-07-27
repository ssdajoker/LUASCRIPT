<?php
function main() {
    $adder = function ($value) {
        return $value + 1;
    };
    echo $adder(1);
}
?>
