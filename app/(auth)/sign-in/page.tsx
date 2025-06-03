import { LoginComponent } from "./components/LoginComponent";

export const metadata = {
  title: "Kitchen Pantry CRM - Sign In",
  description: "Sign in to access your Food Service CRM",
};

const SignInPage = async () => {
  return (
    <div className="h-full">
      <div className="py-10">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Welcome to {process.env.NEXT_PUBLIC_APP_NAME || "Kitchen Pantry CRM"}
        </h1>
      </div>
      <div>
        <LoginComponent />
      </div>
    </div>
  );
};

export default SignInPage;