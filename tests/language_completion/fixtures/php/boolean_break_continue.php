<?php
function main() {
  echo "php_bool_loop";
  $total = 0;
  $ready = true;
  for ($i = 0; $i < 6; $i += 1) {
    if ($i == 1) {
      continue;
    }
    if ($i > 4) {
      break;
    }
    if ($ready && $i >= 2) {
      $total += $i;
    }
  }
  echo $total;
}
?>
