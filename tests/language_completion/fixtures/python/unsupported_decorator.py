def trace(fn):
    return fn

@trace
def work():
    return 1

print(work())
