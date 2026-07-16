#include <iostream>

int main()
{
    int i = 0;
    int total = 0;
    while (i < 4)
    {
        total += i;
        i++;
    }
    std::cout << "cpp_while " << total << std::endl;
}
