import type { NextPage } from "next"
import Head from "next/head"
import styled from "@emotion/styled"
import { Hero } from "../components/Hero"

const View = styled.main`
  position: relative;
  display: grid;
  grid-gap: 1rem;
  text-align: center;

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
  return (
    <div>
      <Head>
        <title>DEVBLOG</title>
      </Head>

      <View>
        <Hero title="COMPUTER">
          <h4>blog</h4>
        </Hero>
      </View>
    </div>
  )
}

export default Home
