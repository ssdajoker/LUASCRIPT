#include <stdio.h>

int main(void)
{
    int total = 0;
    for (int i = 1; i <= 4; i++)
    {
        total += i;
    }
    printf("c_for %d\n", total);
}
