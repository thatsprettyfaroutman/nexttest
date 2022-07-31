import "../styles/globals.css"
import type { AppProps } from "next/app"
import { Global, css } from "@emotion/react"
import { ThemeProvider } from "@emotion/react"
import { Leva } from "leva"
import { theme } from "../styles/theme"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ThemeProvider theme={theme}>
        <Global
          styles={(theme) => css`
            html,
            body {
              margin: 0;
              background-color: ${theme.background};
              color: ${theme.foreground};
              font-size: 16px;
              cursor: none;

              * {
                font-family: "Open Sans", sans-serif;
              }

              h1,
              h2,
              h3,
              h4,
              h5,
              h6 {
                font-family: "Cairo", sans-serif;
              }

              h1,
              h2,
              h3,
              h4,
              h5,
              h6,
              p {
                line-height: 1;
                margin: 0;
              }
            }
          `}
        />
        <Component {...pageProps} />
      </ThemeProvider>
      <Leva collapsed />
    </>
  )
}

export default MyApp
