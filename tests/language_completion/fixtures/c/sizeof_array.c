#include <stdio.h>

int main(void)
{
    int values[] = { 2, 4, 6, 8 };
    int count = sizeof(values) / sizeof(values[0]);
    printf("c_sizeof %d %d\n", count, values[count - 1]);
}
