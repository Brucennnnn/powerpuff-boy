"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@web/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@web/components/ui/form";
import { Input } from "@web/components/ui/input";
import Typography from "@web/components/ui/typography";
import { useLogin } from "@web/provider/hook/auth/useLogin";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

const Page = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const { mutate } = useLogin();

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(
      { username: values.username, password: values.password },
      {
        onSuccess: (data) => {
          if (!data) {
            return;
          }
          localStorage.setItem("token", data.token);
        },
        onError: (error) => {
          console.log(error);
        },
      },
    );
    console.log(values);
  }
  function onError(errors: any) {
    console.log(errors);
  }
  return (
    <div className="bg-white min-w-dvw min-h-dvh flex justify-center items-center">
      <div className="flex w-[540px] h-fit flex-col justify-center items-center">
        <Typography variant="h1">
          Next <span className="text-coralred">LEVEL</span>
        </Typography>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-8 flex w-full flex-col i"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Page;
