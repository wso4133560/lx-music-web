// Support qualitys: 128k 320k flac wav

const sources: Array<{
  id: string
  name: string
  disabled: boolean
  supportQualitys: Partial<Record<LX.OnlineSource, LX.Quality[]>>
}> = [
  {
    id: 'test',
    name: '测试接口',
    disabled: false,
    supportQualitys: {
      mg: ['128k', '320k', 'flac', 'flac24bit'],
    },
  },
  // {
  //   id: 'temp',
  //   name: '临时接口',
  //   disabled: false,
  //   supportQualitys: {
  //     kw: ['128k'],
  //   },
  // },
]

export default sources
