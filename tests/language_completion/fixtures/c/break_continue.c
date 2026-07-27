#include <stdio.h>

int main(void)
{
    int total = 0;
    for (int i = 1; i <= 6; i++)
    {
        if (i == 3)
        {
            continue;
        }
        if (i > 5)
        {
            break;
        }
        total += i;
    }
    printf("c_break_continue %d\n", total);
}
