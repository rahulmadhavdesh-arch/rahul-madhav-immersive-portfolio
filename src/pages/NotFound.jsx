import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found — Rahul Madhav Deshpande";
  }, []);

  return (
    <main className="not-found" id="main-content">
      <div>
        <p className="label accent">404 · Signal lost</p>
        <h1 className="h-mega">This page isn’t here.</h1>
        <p className="p-lead">The portfolio is still available from the beginning.</p>
        <a className="btn mt-8 inline-flex" href="/">Return home</a>
      </div>
    </main>
  );
}
