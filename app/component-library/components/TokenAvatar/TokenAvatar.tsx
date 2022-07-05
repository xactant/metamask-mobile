import React, { useState } from 'react';
import { Image } from 'react-native';
import BaseAvatar, { BaseAvatarSize } from '../BaseAvatar';
import { TokenAvatarProps } from './TokenAvatar.types';
import BaseText, { BaseTextVariant } from '../BaseText';
import stylesheet from './TokenAvatar.styles';
import { useStyles } from '../../../component-library/hooks';
import { TOKEN_AVATAR_IMAGE_ID } from '../../../constants/test-ids';

const TokenAvatar = ({
  size,
  style,
  tokenName,
  tokenImageUrl,
  useHalo,
}: TokenAvatarProps) => {
  const [showPlaceholder, setShowPlaceholder] = useState(!tokenImageUrl);
  const haloColor = useHalo ? '#ffffff20' : null;

  const { styles } = useStyles(stylesheet, {
    style,
    size,
    showPlaceholder,
    haloColor,
  });

  const textVariant =
    size === BaseAvatarSize.Sm || size === BaseAvatarSize.Xs
      ? BaseTextVariant.lBodySM
      : BaseTextVariant.lBodyMD;
  const chainNameFirstLetter = tokenName?.[0] ?? '?';

  const onError = () => setShowPlaceholder(true);

  const avatarSize = (() => {
    if (!useHalo) return size;

    switch (size) {
      case BaseAvatarSize.Xs:
      case BaseAvatarSize.Sm:
        return BaseAvatarSize.Xs;
      case BaseAvatarSize.Md:
        return BaseAvatarSize.Sm;
      case BaseAvatarSize.Lg:
        return BaseAvatarSize.Md;
      case BaseAvatarSize.Xl:
        return BaseAvatarSize.Lg;
      default:
        return size;
    }
  })();

  return (
    <BaseAvatar size={avatarSize} style={styles.base}>
      {showPlaceholder ? (
        <BaseText style={styles.label} variant={textVariant}>
          {chainNameFirstLetter}
        </BaseText>
      ) : (
        <Image
          source={{ uri: tokenImageUrl }}
          style={styles.image}
          onError={onError}
          testID={TOKEN_AVATAR_IMAGE_ID}
        />
      )}
    </BaseAvatar>
  );
};

export default TokenAvatar;
