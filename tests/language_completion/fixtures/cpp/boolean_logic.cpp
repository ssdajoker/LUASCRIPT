#include <iostream>
#include <string>

int main()
{
    int total = 8;
    bool ready = true;
    std::string label = "blocked";
    if (ready && total == 8)
    {
        label = "ready";
    }
    std::cout << "cpp_bool " << label << std::endl;
}
