def add_bonus(items):
    total = 0
    for index in range(0, 3):
        total = total + items[index]

    if total >= 10:
        return total
    return total + 100

numbers = [2, 4, 6]
print("py_medium", add_bonus(numbers))
