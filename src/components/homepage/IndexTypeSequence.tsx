import { useCallback, useState } from "react";
import BlurText from "@/components/effects/BlurTextGsap";

interface IndexTypeSequenceProps {
  title: string;
  description: string;
  siteDescription: string;
}

const IndexTypeSequence = ({
  title,
  description,
  siteDescription,
}: IndexTypeSequenceProps) => {
  const [step, setStep] = useState(0);

  const showDescription = useCallback(() => {
    setStep((current) => Math.max(current, 1));
  }, []);

  const showSiteDescription = useCallback(() => {
    setStep((current) => Math.max(current, 2));
  }, []);

  return (
    <>
      <BlurText
        text={title}
        className="text-[16rem]"
        as="h1"
        animateBy="letters"
        delay={70}
        direction="top"
        variant="noBounce"
        stepDuration={0.38}
        onAnimationComplete={showDescription}
      />
      {step >= 1 && (
        <BlurText
          text={description}
          className="text-[4rem] text-center px-10"
          as="h2"
          animateBy="letters"
          delay={34}
          direction="top"
          variant="noBounce"
          stepDuration={0.34}
          onAnimationComplete={showSiteDescription}
        />
      )}
      {step >= 2 && (
        <BlurText
          text={siteDescription}
          className="text-[2rem] font-mono text-center mt-10"
          animateBy="letters"
          delay={22}
          direction="top"
          variant="noBounce"
          stepDuration={0.32}
        />
      )}
    </>
  );
};

export default IndexTypeSequence;
