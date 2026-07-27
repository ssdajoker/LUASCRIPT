#include <stdio.h>

int score(int value)
{
    if (value > 5)
    {
        return value + 1;
    }
    return value + 2;
}

int main(void)
{
    int result = score(5);
    const char *label = "small";
    if (score(8) > 7)
    {
        label = "big";
    }
    printf("c_branch %s %d\n", label, result);
}
