import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/Page";

export function Component() {
  return (
    <Page title="Page not found" intro="That address does not match anything here.">
      <Button asChild><Link to="/">Go to Today</Link></Button>
    </Page>
  );
}
