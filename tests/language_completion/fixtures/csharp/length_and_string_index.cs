using System;

public class Program
{
    public static void Main()
    {
        int[] values = new int[] { 4, 5, 6 };
        string word = "maze";
        int combined = values.Length + word.Length;
        Console.WriteLine("cs_length " + combined + " " + values[1] + " " + word[0]);
    }
}
