#include <iostream>

int main()
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
    std::cout << "cpp_break_continue " << total << std::endl;
}
