import type { NextPage } from "next"
import Head from "next/head"
import styled from "@emotion/styled"
import { useControls } from "leva"
import { Hero } from "../components/Hero"
import { Cursors } from "../components/Cursors"

// TODO: multiplayer blog, see other users browsing the site
// TODO: character builder that float near the cursor
// TODO: make multiplayer cursors POOF-vanish when they enter links on the site
// TODO: each internal link on the site has a counter or some indicator of how many people there are on that page currently
// TODO: speech bubbles for characters

const View = styled.main`
  position: relative;
  display: grid;
  grid-gap: 1rem;
  text-align: center;
  padding-bottom: 50vh;

  > :first-child {
    margin-bottom: 1rem;
  }
`

const SubHeading = styled.p`
  color: ${({ theme }) => theme.foreground};
  opacity: 0.6;
  font-size: 18px;
`

const Home: NextPage = () => {
  const { title } = useControls({
    title: "COMPUTER BLOG",
  })

  return (
    <div>
      <Head>
        <title>DEVBLOG</title>
      </Head>

      <View>
        <Hero title={title}>{/* <h4>blog</h4> */}</Hero>
      </View>

      <Cursors />
    </div>
  )
}

export default Home
