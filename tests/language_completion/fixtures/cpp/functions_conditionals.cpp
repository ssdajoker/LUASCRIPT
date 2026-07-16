#include <iostream>
#include <string>

int score(int value)
{
    if (value > 5)
    {
        return value + 1;
    }
    return value + 2;
}

int main()
{
    int result = score(5);
    std::string label = "small";
    if (score(8) > 7)
    {
        label = "big";
    }
    std::cout << "cpp_branch " << label << " " << result << std::endl;
}
