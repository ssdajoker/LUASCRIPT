#include <stdio.h>

int main(void)
{
    int i = 0;
    int total = 0;
    while (i < 4)
    {
        total += i;
        i++;
    }
    printf("c_while %d\n", total);
}
