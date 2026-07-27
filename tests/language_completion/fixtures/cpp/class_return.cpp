#include <iostream>

class Pair
{
public:
    double left;
    double right;
};

Pair make_pair(double left, double right)
{
    Pair pair = {left, right};
    return pair;
}

int main()
{
    Pair pair = make_pair(8, 13);
    std::cout << "cpp_class_return " << pair.left << " " << pair.right << std::endl;
}
