#include <stdio.h>

int main(void)
{
    int value = 4;
    int *ptr = &value;
    printf("%d\n", *ptr);
}
