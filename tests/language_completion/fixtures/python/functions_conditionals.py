def label(value):
    if value > 5:
        return "big"
    elif value == 5:
        return "equal"
    else:
        return "small"

print("py_branch", label(7), label(5), label(3))
