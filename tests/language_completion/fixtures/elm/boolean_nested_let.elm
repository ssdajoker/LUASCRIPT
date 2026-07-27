double x = x * 2
add a b = a + b
isWindow value = value >= 10 && value < 20 && not (value == 13)
score value = let doubled = double value; picked = at 1 [3, 9, 4] in if isWindow doubled then add (double value) picked else 0
main = print "elm_v02"; print (score 6)
