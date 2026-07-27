using System;

public class Program
{
    public static int Score(int value)
    {
        if (value > 5)
        {
            return value + 1;
        }
        return value + 2;
    }

    public static void Main()
    {
        int score = Score(5);
        string label = "small";
        if (Score(8) > 7)
        {
            label = "big";
        }
        Console.WriteLine("cs_branch " + label + " " + score);
    }
}
