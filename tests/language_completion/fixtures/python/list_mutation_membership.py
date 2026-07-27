items = [2, 3]
items.append(4)
last = items.pop()
items.append(last + 1)

if 3 in items and not (4 in items):
    status = "membership_ok"
else:
    status = "membership_bad"

print("py_list_mutation", len(items), items[0], items[2], status)

