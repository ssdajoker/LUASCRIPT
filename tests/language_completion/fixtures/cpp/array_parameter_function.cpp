#include <iostream>

int sum_values(int values[], int count)
{
    int total = 0;
    for (int i = 0; i < count; i++)
    {
        total += values[i];
    }
    return total;
}

int main()
{
    int values[] = { 2, 3, 5 };
    int count = 3;
    int total = sum_values(values, count);
    std::cout << "cpp_array_fn " << total << std::endl;
}
