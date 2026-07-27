#include <stdio.h>

int sum_values(int values[], int count)
{
    int total = 0;
    for (int i = 0; i < count; i++)
    {
        total += values[i];
    }
    return total;
}

int main(void)
{
    int values[] = { 2, 3, 5 };
    int count = sizeof(values) / sizeof(values[0]);
    int total = sum_values(values, count);
    printf("c_array_fn %d\n", total);
}
