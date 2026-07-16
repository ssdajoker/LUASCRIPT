#include <stdio.h>

int main(void)
{
    int values[] = { 2, 4, 6 };
    int total = values[0] + values[2];
    printf("c_array %d %d\n", total, values[1]);
}
