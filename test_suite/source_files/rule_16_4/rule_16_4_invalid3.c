static void foo16_4_5(void)
{
    int x_var, a_var= 14;
    switch (x_var) { /* violation of rule 16.4 and 16.6 */
    case 1:
        ++x_var;
        break;
    }

    switch (x_var) { /* violation of rule 16.4 and 16.6 */
    case 0:
        ++x_var;
        if (a_var > 4)
        {
            x_var = 7;
            break;
        }
        break;
    }
}