profile = {"name": "Ada", "scores": [2, 4]}
profile["scores"][1] = profile["scores"][1] + 3
profile["active"] = 1

if "name" in profile and not ("missing" in profile):
    status = "dict_ok"
else:
    status = "dict_bad"

print("py_dict_mutation", profile["name"], profile["scores"][1], status)

