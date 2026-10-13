import { Image } from "expo-image";
import { cssInterop } from "nativewind";
import { Text, View } from "react-native";

const StyledImage = cssInterop(Image, { className: "style" });

export function FeaturedMealCard() {
  return (
    <View className="relative min-h-[176px] rounded-[28px] bg-primary overflow-hidden p-[20px] mb-[16px]">
      {/* Decorative background */}
      <View className="absolute w-[210px] h-[210px] rounded-full bg-white/10 -right-[60px] -top-[50px]" />

      <View className="w-[57%]">
        <View className="self-start rounded-full bg-white/15 px-[10px] py-[5px] mb-[12px]">
          <Text className="font-poppins-semibold text-white text-[10px]">
            Tonight&apos;s dinner
          </Text>
        </View>

        <Text className="font-poppins-bold text-white text-[23px] leading-[28px]">
          Salmon grain{"\n"}bowl
        </Text>

        <Text className="font-poppins text-white/90 text-[11px] mt-[8px]">
          520 kcal · 38 g protein
        </Text>
      </View>

      {/* Existing illustration used as a placeholder */}
      <View className="absolute right-[14px] bottom-[20px] w-[116px] h-[116px] rounded-full overflow-hidden">
        <StyledImage
          source={require("@/assets/images/meals/lunch.png")}
          className="w-full h-full"
          contentFit="cover"
          accessible={false}
        />
      </View>
    </View>
  );
}